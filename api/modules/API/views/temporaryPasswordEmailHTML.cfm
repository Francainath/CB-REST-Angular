<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>Password Reset</title>
		<style type="text/css">
			.ExternalClass {width:100%;}
			.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
			body {-webkit-text-size-adjust:none; -ms-text-size-adjust:none;}
			body {margin:0; padding:0;}
			table td {border-collapse:collapse;}
			p {margin:0; padding:0; margin-bottom:1.15em;}
			h1, h2, h3, h4, h5, h6 {color: black; line-height: 100%;}
			a, a:link {color:#2A5DB0; text-decoration: underline;}
			body, #body_style {background:#ededed; min-height:1000px; color:#000; font-family:Arial, Helvetica, sans-serif; font-size:12px;}
			span.yshortcuts { color:#000; background-color:none; border:none;}
			span.yshortcuts:hover, span.yshortcuts:active, span.yshortcuts:focus {color:#000; background-color:none; border:none;}
			span.appleLinks a { color:#a4a4a4; text-decoration: none;}
			a:visited { color: #000000; text-decoration: none}
			a:focus { color: #000000; text-decoration: underline}
			a:hover { color: #000000; text-decoration: underline}
		</style>
	</head>
	<body style="background:#ededed; min-height:1000px; color:#000000; font-family:Arial, Helvetica, sans-serif; font-size: 12px" alink="#000000" link="#000000" bgcolor="#000000" text="#000000" yahoo="fix">
		<div id="body_style" style="padding:15px;">
			<table width="540" border="1" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-color: #E5E5E5" align="center">
				<tr>
					<td>
						<table width="100%" cellspacing="0" cellpadding="0" border="0">
							<tbody>
								<tr>
									<td width="100%" bgcolor="#ffffff">
										<table width="100%" cellspacing="10" cellpadding="0" border="0">
											<tbody>
												<tr>
													<td align="left" style="font-size: 14px; padding: 10px;">

														<cfoutput>
															<p>Dear #rc.firstName# #rc.lastName#<p>
															<p>A new password has been generated for you:</p>
															<p>#rc.password#</p>
															<cfif structKeyExists(rc, 'isUser')>
																<p>Please use this password with your current username and log back in</p>
															<cfelse>
																<p>Please use this password with your current username and login to your account.</p>
																<p><a href="http://#cgi.host_name#/##/login">Click here to login</a></p>
															</cfif>
														</cfoutput>

													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</table>
		</div>
	</body>
</html>